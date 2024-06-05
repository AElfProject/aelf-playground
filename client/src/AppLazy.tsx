import { BrowserRouter } from "react-router-dom";

import IDE from "./pages/ide";

const AppLazy = () => (
  <BrowserRouter>
    <IDE />
  </BrowserRouter>
);

export default AppLazy;
