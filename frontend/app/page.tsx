import { Faculty_Glyphic } from "next/font/google";
import Image from "next/image";

const internalBase = process.env.INTERNAL_API_BASE_URL ?? "http://backend:8000";
const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getHealth(){
  let status = "NOT OKAY";
  try{
    const res = await fetch(`${internalBase}/api/health`, {cache: "no-store"});
    if(res.ok) status = "OKAY";
  }
  catch(e){
    console.error("Error fetching health status:", e);
  }
  return status;
}

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            The current Backend Health Status is: <span className="font-bold">{getHealth()}</span>
          </h1>
        </div>
      </main>
    </div>
  );
}
