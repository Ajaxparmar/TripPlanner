import Image from "next/image";

export function Brand() {
  return <span className="brand">
    <Image
      src="/tripthread-logo.png"
      alt="Tripthread — Journey Connected"
      width={1408}
      height={768}
      sizes="(max-width: 650px) 330px, 390px"
    />
  </span>;
}
