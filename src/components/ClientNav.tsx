"use client";
import dynamic from "next/dynamic";

const Nav = dynamic(
  async () => { const { Nav } = await import("@/components/Nav"); return Nav; },
  { ssr: false }
);

export default function ClientNav() {
  return <Nav />;
}
