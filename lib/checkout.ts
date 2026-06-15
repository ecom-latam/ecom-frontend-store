const ALNUM = /[^a-zA-Z0-9]/g;

export function filterName(raw: string): string {
  return raw
    .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]/g, '')
    .replace(/^ +/, '')
    .replace(/ {2,}/g, ' ')
    .slice(0, 50);
}
export function filterStreet(raw: string):       string { return raw.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s.,\-]/g, '').slice(0, 50); }
export function filterStreetNumber(raw: string): string { return raw.replace(ALNUM, '').slice(0, 8); }
export function filterCity(raw: string):         string { return raw.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s.\-]/g, '').slice(0, 40); }
export function filterFloor(raw: string):        string { return raw.replace(/\D/g, '').slice(0, 2); }
export function filterApartment(raw: string):    string { return raw.replace(ALNUM, '').slice(0, 5); }
export function filterZip(raw: string):          string { return raw.replace(/\D/g, '').slice(0, 4); }

export function splitAddress(addr: {
  fullName:  string;
  phone:     string;
  address:   string;
  floor?:    string;
  city:      string;
  province:  string;
  zip?:      string;
}) {
  const lastSpace = addr.address.lastIndexOf(' ');
  const tail      = addr.address.slice(lastSpace + 1);
  const hasNumber = lastSpace > 0 && /^\d+[a-zA-Z]?$/.test(tail);
  return {
    fullName:     addr.fullName,
    phone:        addr.phone,
    street:       hasNumber ? addr.address.slice(0, lastSpace) : addr.address,
    streetNumber: hasNumber ? tail : '',
    floor:        addr.floor ?? '',
    apartment:    '',
    city:         addr.city,
    province:     addr.province,
    zip:          addr.zip ?? '',
  };
}
