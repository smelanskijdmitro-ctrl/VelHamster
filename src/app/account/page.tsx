import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import LogoutButton from "./logout-button";
export default async function Account(){const {user,profile,isAdmin}=await getViewer();if(!user)redirect("/login");return <main className="shell"><div className="authwrap"><div className="panel"><div className="eyebrow">Личный кабинет</div><h2>{profile?.username??"Игрок VelHamster"}</h2><p className="hint">{user.email}</p><p className="notice">Роль: {isAdmin?"Администратор":"Игрок"}</p>{isAdmin&&<Link className="btn primary" href="/admin">Открыть админ-панель</Link>}<div style={{marginTop:18}}><LogoutButton/></div><p className="hint"><Link href="/">← На главную</Link></p></div></div></main>}