import { Globe, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-[#ece4d6] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-base text-[#6b5e4a]">
        {/* Left */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <span className="font-semibold text-lg text-[#2c2417]">Tapree</span>
          <span>© {new Date().getFullYear()} All rights reserved</span>
        </div>

        {/* Center */}
        <div className="flex gap-6">
          {['About', 'Careers', 'Blog'].map((item) => (
            <span key={item} className="cursor-pointer hover:text-black transition">
              {item}
            </span>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-5">
          <Mail className="h-5 w-5 cursor-pointer hover:text-black transition" />
          <Globe className="h-5 w-5 cursor-pointer hover:text-black transition" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
