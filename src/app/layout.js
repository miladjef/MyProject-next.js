import "./globals.css";
import AOSInit from "@/utils/aos";
import ScrollToTop from "@/utils/SctollToTop";
export const metadata={title:"صفحه اصلی - SET Coffee | فروشگاه اینترنتی قهوه ست",description:"Coffee shop application. Programmer: miladjef",authors:[{name:"miladjef"}],icons:{icon:"https://creazilla-store.fra1.digitaloceanspaces.com/cliparts/36190/coffee-logo-clipart-md.png"}};
export default function RootLayout({children}){return <html lang="fa" dir="rtl"><body><AOSInit/>{children}<ScrollToTop/></body></html>;}
