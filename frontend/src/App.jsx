import './App.css'
import HomePage from './page/HomePage'
import SignInPage from './page/SignInPage';
import SignUpPage from './page/SignUpPage';
import Appointment from './components/Patient/Appointment';
import ContactUs from './components/Patient/ContactUs';
import AboutUs from './components/Patient/AboutUs';
import DoctorAuthPage from './page/DoctorAuthPage';
import NurseAuthPage from './page/NurseAuthPage';
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
        <Route path="/sign-up" element={<SignUpPage/>}/>
        <Route path="/doctor-sign-in" element={<DoctorAuthPage/>}/>
        <Route path="/nurse-sign-in" element={<NurseAuthPage/>}/>
      </Routes>
    </Router> 
  )
}

export default App
