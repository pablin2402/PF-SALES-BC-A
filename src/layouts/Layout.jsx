export default function Layout({ children, isSidebarOpen }) {
    return (
      <main
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-[250px]" : "ml-[70px]"
        } p-4`}
      >
        {children}
      </main>
    );
  }
  