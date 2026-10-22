import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-700">
      <Header />
      <main className="flex-1">
        <div className="container-page py-8 lg:py-10">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
