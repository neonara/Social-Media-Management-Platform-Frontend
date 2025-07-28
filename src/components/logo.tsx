import darkLogo from "@/assets/logos/logo_white.png";
import logo from "@/assets/logos/logo_black.png";

import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-16 max-w-50">
      <Image
        src={logo}
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 33vw"
        className="object-contain object-left dark:hidden"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
      />

      <Image
        src={darkLogo}
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="hidden object-contain object-left dark:block"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
