import { FaEnvelopeOpenText, FaInternetExplorer, FaPhone, FaTelegramPlane } from "react-icons/fa";
import styles from "./information.module.css";
import { PiCoffeeFill } from "react-icons/pi";
import { BiSolidContact } from "react-icons/bi";

const Information = () => {
  const siteName = process.env.SITE_NAME || "فروشگاه قهوه";
  const siteUrl = process.env.SITE_URL || "";
  const siteAddress = process.env.SITE_ADDRESS || "";
  const sitePhone = process.env.SITE_PHONE || "";
  const siteEmail = process.env.SITE_EMAIL || "";
  const siteSocial = process.env.SITE_SOCIAL || "";
  return <section className={styles.Information}><span>تماس با ما</span><p>اطلاعات تماس</p><div><PiCoffeeFill/><p>{siteName}</p></div>{siteUrl&&<div><FaInternetExplorer/><p>{siteUrl}</p></div>}{siteAddress&&<div><BiSolidContact/><p>{siteAddress}</p></div>}{sitePhone&&<div><FaPhone/><p>{sitePhone}</p></div>}{siteEmail&&<div><FaEnvelopeOpenText/><p>{siteEmail}</p></div>}{siteSocial&&<div><FaTelegramPlane/><p>{siteSocial}</p></div>}</section>;
};
export default Information;
