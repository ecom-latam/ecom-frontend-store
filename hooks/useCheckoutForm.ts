'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { usePageConfig } from '@/context/PageConfigContext';
import { getAccessTokenRole } from '@/utils/helpers';
import { orders } from '@/utils/api/orders';
import type { PaymentMethod, ShippingMethod } from '@/utils/api/orders';
import type { Address } from '@/utils/api/addresses';
import { payment as paymentApi } from '@/utils/api/payment';
import { splitAddress } from '@/lib/checkout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAddressesRequest } from '@/store/addresses/addressesSlice';

export interface CheckoutForm {
  fullName:       string;
  phone:          string;
  street:         string;
  streetNumber:   string;
  floor:          string;
  apartment:      string;
  city:           string;
  province:       string;
  zip:            string;
  shippingMethod: ShippingMethod;
  paymentMethod:  PaymentMethod;
  notes:          string;
}

const INITIAL_FORM: CheckoutForm = {
  fullName: '', phone: '', street: '', streetNumber: '',
  floor: '', apartment: '', city: '', province: '', zip: '',
  shippingMethod: 'delivery', paymentMethod: 'transfer', notes: '',
};

export function useCheckoutForm() {
  const router = useRouter();
  const { items, itemCount, clearCart } = useCart();
  const { store } = usePageConfig();
  const currency = store?.currency;
  const dispatch = useAppDispatch();
  const { list: reduxAddresses, loading: addressesLoading } = useAppSelector((s) => s.addresses);
  const addressInitialized = useRef(false);

  const mpAvailable = !!store?.mp_public_key && currency === 'ARS';
  const subtotal     = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [ready,             setReady]             = useState(false);
  const [submitting,        setSubmitting]        = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [savedAddresses,    setSavedAddresses]    = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [form,              setForm]              = useState<CheckoutForm>(INITIAL_FORM);

  useEffect(() => {
    const role = getAccessTokenRole();
    if (!role) { router.replace('/iniciar-sesion?redirect=/checkout'); return; }
    if (role !== 'Customer') { router.replace('/productos'); return; }
    setReady(true);
    dispatch(fetchAddressesRequest());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — router is stable in practice but not guaranteed; auth check runs once on mount

  useEffect(() => {
    if (addressInitialized.current || addressesLoading) return;
    addressInitialized.current = true;
    setSavedAddresses(reduxAddresses);
    const def = reduxAddresses.find((a) => a.isDefault) ?? reduxAddresses[0];
    if (def) {
      setSelectedAddressId(def._id);
      setForm((prev) => ({ ...prev, ...splitAddress(def) }));
    }
  }, [reduxAddresses, addressesLoading]);

  function set(field: keyof CheckoutForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function applyAddress(id: string) {
    setSelectedAddressId(id);
    if (id === 'new') {
      setForm((prev) => ({ ...prev, fullName: '', phone: '', street: '', streetNumber: '', floor: '', apartment: '', city: '', province: '', zip: '' }));
      return;
    }
    const addr = savedAddresses.find((a) => a._id === id);
    if (addr) setForm((prev) => ({ ...prev, ...splitAddress(addr) }));
  }

  const fullStreet = [form.street.trim(), form.streetNumber.trim()].filter(Boolean).join(' ')
    + (form.floor.trim() ? `, Piso ${form.floor.trim()}` : '')
    + (form.apartment.trim() ? ` Dpto ${form.apartment.trim()}` : '');

  const shippingAddress = {
    fullName: form.fullName,
    phone:    form.phone,
    address:  fullStreet,
    city:     form.city,
    province: form.province,
    zip:      form.zip,
  };

  async function payWithTransfer() {
    const { data: order } = await orders.create({
      shippingAddress,
      paymentMethod:  'transfer',
      shippingMethod: form.shippingMethod,
      notes:          form.notes,
    });
    await clearCart();
    router.push(`/pedidos/${order._id}`);
  }

  async function payWithMercadoPago() {
    const { data } = await paymentApi.createMpPreference({
      shippingAddress,
      shippingMethod: form.shippingMethod,
      notes:          form.notes,
      storeOrigin:    window.location.origin,
    });
    window.location.href = data.initPoint;
  }

  async function handleSubmit() {
    if (form.fullName.trim().length < 3) {
      setError('El nombre completo es requerido (mínimo 3 caracteres).');
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('El teléfono debe incluir código de área y número completo (mínimo 10 dígitos).');
      return;
    }
    if (phoneDigits.length > 11) {
      setError('El teléfono no puede tener más de 11 dígitos.');
      return;
    }
    if (form.shippingMethod === 'delivery') {
      if (form.street.trim().length < 3)  { setError('Ingresá el nombre de la calle.'); return; }
      if (!form.streetNumber.trim())        { setError('El número de calle es requerido.'); return; }
      if (form.city.trim().length < 2)    { setError('Ingresá la ciudad.'); return; }
      if (!form.province)                   { setError('Seleccioná una provincia.'); return; }
      if (form.zip && !/^\d{4}$/.test(form.zip)) { setError('El código postal debe tener 4 dígitos.'); return; }
    }
    setSubmitting(true);
    setError(null);
    try {
      if (form.paymentMethod === 'mp') await payWithMercadoPago();
      else                             await payWithTransfer();
    } catch {
      setError('No se pudo iniciar el pago. Intentá nuevamente.');
      setSubmitting(false);
    }
  }

  return {
    ready, submitting, error,
    savedAddresses, selectedAddressId,
    form, set, applyAddress, handleSubmit,
    mpAvailable,
    subtotal, items, itemCount, currency,
  };
}
