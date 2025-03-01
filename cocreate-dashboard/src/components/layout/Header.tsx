const Header = () => {
  return (
    <div className="flex justify-between items-center p-8 bg-[#000] h-[7.5vh]">
      <div className="flex items-center gap-5">
        {/* <img src="../logo.png" alt="logo" className="w-10 h-10" /> */}
        <h1 className="text-2xl text-white">CoCreate</h1>
      </div>
      <div className="flex items-center gap-5">
        <button className="text-blue-500">Dashboard</button>
        {/* <button className="text-white">Projects</button> */}
        {/* <button className="text-white">Settings</button> */}
        {/* <button className="text-white">Logout</button> */}
      </div>
    </div>
  );
}
 
export default Header;