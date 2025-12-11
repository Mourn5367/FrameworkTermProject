import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-10 mb-6 text-center px-4">
      <div className="flex justify-center items-center gap-6 mb-4 flex-wrap">
        <Image
          src="/images/logo.png"
          alt="DunSight"
          width={120}
          height={32}
          className="opacity-60"
        />
        <span className="text-gray-400">|</span>
        <a
          href="https://developers.neople.co.kr/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          <Image
            src="/images/neople-logo.png"
            alt="Powered by OpenAPI"
            width={191}
            height={36}
            className="opacity-60"
          />
        </a>
        <span className="text-gray-400">|</span>
        <a
          href="#"
          className="text-sm text-gray-600 hover:text-[#3DB89E] transition-colors font-medium"
        >
          개인정보 처리 방침
        </a>
        <span className="text-gray-400">|</span>
        <a
          href="#"
          className="text-sm text-gray-600 hover:text-[#3DB89E] transition-colors font-medium"
        >
          건의사항
        </a>
      </div>
      <p className="text-gray-500 text-xs">© 2025 DunSight. All rights reserved.</p>
    </footer>
  );
}
