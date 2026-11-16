import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import AdminInbox from "./inbox";
export default async function Admin(){const {user,isAdmin}=await getViewer();if(!user)redirect("/login");if(!isAdmin)redirect("/");return <main className="shell" style={{paddingTop:40,paddingBottom:70}}><div className="eyebrow">CONTROL CENTER</div><h1>Админ-панель</h1><p className="hint">Управление обращениями VelHamster. Создание тем доступно в каждом разделе форума.</p><div className="notice">Вы вошли с правами администратора. Никогда не выдавай роль admin через публичную форму регистрации.</div><AdminInbox/><p className="hint"><Link href="/">← Вернуться на форум</Link></p></main>}