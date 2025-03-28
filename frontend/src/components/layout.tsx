import { Outlet } from "react-router-dom";
import Header from "./header";

const Layout = () => {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <footer className="footer">
            <div className="footer-container">
              <p>Made with 💗 by StudyBuds</p>
            </div>
      </footer>
    </>
  );
};

export default Layout;
