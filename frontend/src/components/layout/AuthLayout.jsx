import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Marrakech Tours</p>
          <h1>Plan days that fit the way you travel.</h1>
        </div>
        <Outlet />
      </section>
    </main>
  );
}
