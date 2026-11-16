 "use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function LogoutButton(){const router=useRouter();return <button className="btn" onClick={async()=>{await createClient().auth.signOut();router.push("/");router.refresh();}}>Выйти из аккаунта</button>}