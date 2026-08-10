/**
 * Catálogo de países para el selector de teléfono.
 * `minDigits`/`maxDigits` son los dígitos nacionales (sin el prefijo).
 */
export type Country = {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
};

export const countries: Country[] = [
  { iso: "MX", name: "México", dialCode: "52", flag: "🇲🇽", minDigits: 10, maxDigits: 10 },
  { iso: "US", name: "Estados Unidos", dialCode: "1", flag: "🇺🇸", minDigits: 10, maxDigits: 10 },
  { iso: "CA", name: "Canadá", dialCode: "1", flag: "🇨🇦", minDigits: 10, maxDigits: 10 },
  { iso: "AR", name: "Argentina", dialCode: "54", flag: "🇦🇷", minDigits: 10, maxDigits: 11 },
  { iso: "BO", name: "Bolivia", dialCode: "591", flag: "🇧🇴", minDigits: 8, maxDigits: 8 },
  { iso: "BR", name: "Brasil", dialCode: "55", flag: "🇧🇷", minDigits: 10, maxDigits: 11 },
  { iso: "CL", name: "Chile", dialCode: "56", flag: "🇨🇱", minDigits: 9, maxDigits: 9 },
  { iso: "CO", name: "Colombia", dialCode: "57", flag: "🇨🇴", minDigits: 10, maxDigits: 10 },
  { iso: "CR", name: "Costa Rica", dialCode: "506", flag: "🇨🇷", minDigits: 8, maxDigits: 8 },
  { iso: "CU", name: "Cuba", dialCode: "53", flag: "🇨🇺", minDigits: 8, maxDigits: 8 },
  { iso: "DO", name: "República Dominicana", dialCode: "1", flag: "🇩🇴", minDigits: 10, maxDigits: 10 },
  { iso: "EC", name: "Ecuador", dialCode: "593", flag: "🇪🇨", minDigits: 9, maxDigits: 9 },
  { iso: "SV", name: "El Salvador", dialCode: "503", flag: "🇸🇻", minDigits: 8, maxDigits: 8 },
  { iso: "GT", name: "Guatemala", dialCode: "502", flag: "🇬🇹", minDigits: 8, maxDigits: 8 },
  { iso: "HN", name: "Honduras", dialCode: "504", flag: "🇭🇳", minDigits: 8, maxDigits: 8 },
  { iso: "NI", name: "Nicaragua", dialCode: "505", flag: "🇳🇮", minDigits: 8, maxDigits: 8 },
  { iso: "PA", name: "Panamá", dialCode: "507", flag: "🇵🇦", minDigits: 7, maxDigits: 8 },
  { iso: "PY", name: "Paraguay", dialCode: "595", flag: "🇵🇾", minDigits: 9, maxDigits: 9 },
  { iso: "PE", name: "Perú", dialCode: "51", flag: "🇵🇪", minDigits: 9, maxDigits: 9 },
  { iso: "PR", name: "Puerto Rico", dialCode: "1", flag: "🇵🇷", minDigits: 10, maxDigits: 10 },
  { iso: "UY", name: "Uruguay", dialCode: "598", flag: "🇺🇾", minDigits: 8, maxDigits: 9 },
  { iso: "VE", name: "Venezuela", dialCode: "58", flag: "🇻🇪", minDigits: 10, maxDigits: 10 },
  { iso: "ES", name: "España", dialCode: "34", flag: "🇪🇸", minDigits: 9, maxDigits: 9 },
  { iso: "PT", name: "Portugal", dialCode: "351", flag: "🇵🇹", minDigits: 9, maxDigits: 9 },
  { iso: "FR", name: "Francia", dialCode: "33", flag: "🇫🇷", minDigits: 9, maxDigits: 9 },
  { iso: "DE", name: "Alemania", dialCode: "49", flag: "🇩🇪", minDigits: 10, maxDigits: 11 },
  { iso: "IT", name: "Italia", dialCode: "39", flag: "🇮🇹", minDigits: 9, maxDigits: 10 },
  { iso: "GB", name: "Reino Unido", dialCode: "44", flag: "🇬🇧", minDigits: 10, maxDigits: 10 },
  { iso: "NL", name: "Países Bajos", dialCode: "31", flag: "🇳🇱", minDigits: 9, maxDigits: 9 },
  { iso: "BE", name: "Bélgica", dialCode: "32", flag: "🇧🇪", minDigits: 9, maxDigits: 9 },
  { iso: "CH", name: "Suiza", dialCode: "41", flag: "🇨🇭", minDigits: 9, maxDigits: 9 },
  { iso: "IE", name: "Irlanda", dialCode: "353", flag: "🇮🇪", minDigits: 9, maxDigits: 9 },
];

export const defaultCountry: Country = countries[0]!;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function findCountryByIso(iso: string): Country | undefined {
  return countries.find((c) => c.iso === iso);
}

/** Compone el número en E.164 a partir del país y los dígitos nacionales. */
export function toE164(country: Country, nationalNumber: string): string {
  const digits = digitsOnly(nationalNumber);
  return digits ? `+${country.dialCode}${digits}` : "";
}

/** Devuelve un mensaje de error en español, o null si el número es válido. */
export function validateNationalNumber(
  country: Country,
  nationalNumber: string,
): string | null {
  const digits = digitsOnly(nationalNumber);
  if (!digits) return "Ingresa el número de teléfono";
  if (digits.length < country.minDigits || digits.length > country.maxDigits) {
    return country.minDigits === country.maxDigits
      ? `El número de ${country.name} debe tener ${country.minDigits} dígitos`
      : `El número de ${country.name} debe tener entre ${country.minDigits} y ${country.maxDigits} dígitos`;
  }
  return null;
}
