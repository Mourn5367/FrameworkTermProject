export default function Footer() {
  return (
    <footer className="mt-10 mb-6 text-center">
      <div className="flex justify-center gap-6 mb-3">
        <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
          로고
        </a>
        <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
          개인정보 처리 방침
        </a>
        <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
          건의사항 링크
        </a>
      </div>
      <p className="text-gray-500 text-xs">© 2025 DnF Insight. All rights reserved.</p>
    </footer>
  );
}
