import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { countries, digitsOnly, toE164, type Country } from "@/lib/phone/countries";

export function PhoneField({
  country,
  onCountryChange,
  nationalNumber,
  onNationalNumberChange,
  error,
}: {
  country: Country;
  onCountryChange: (country: Country) => void;
  nationalNumber: string;
  onNationalNumberChange: (value: string) => void;
  error?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const e164 = toE164(country, nationalNumber);

  return (
    <div className="space-y-2">
      <Label htmlFor="wa-phone-number">Phone number</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Código de país"
              className="w-[122px] shrink-0 justify-between px-3 font-normal"
            >
              <span className="truncate">
                {country.flag} +{country.dialCode}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar país…" />
              <CommandList>
                <CommandEmpty>Sin resultados.</CommandEmpty>
                <CommandGroup>
                  {countries.map((c) => (
                    <CommandItem
                      key={c.iso}
                      value={`${c.name} ${c.dialCode} ${c.iso}`}
                      onSelect={() => {
                        onCountryChange(c);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          c.iso === country.iso ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="mr-2">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-muted-foreground">+{c.dialCode}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Input
          id="wa-phone-number"
          type="tel"
          inputMode="tel"
          value={nationalNumber}
          onChange={(e) => onNationalNumberChange(digitsOnly(e.target.value).slice(0, 15))}
          placeholder="6621234567"
          autoComplete="tel-national"
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : e164 ? (
        <p className="text-xs text-muted-foreground">Se enviará como {e164}</p>
      ) : null}
    </div>
  );
}
