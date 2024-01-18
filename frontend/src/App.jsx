import './App.css'
import HomePage from './page/HomePage'
import SignInPage from './page/SignInPage';
import Appointment from './components/Patient/Appointment';
import ContactUs from './components/Patient/ContactUs';
import AboutUs from './components/Patient/AboutUs';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  

  return (
    <Router>
      <Routes>
        <Route path="/home" element={<HomePage/>}/>
        <Route path="/appointment" element={<Appointment/>}/>
        <Route path="/contact-us" element={<ContactUs/>}/>
        <Route path="/about-us" element={<AboutUs/>}/>
        <Route path="/sign-in" element={<SignInPage/>}/>
      </Routes>
    </Router> 
  )
}

export default App
