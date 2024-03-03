import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import profilePic from "../../../assets/doct5.jpg";
import axios from "axios";
import Swal from "sweetalert2";
import NurseSidebar from "./NurseSidebar";

function NurseMedication() {
  const [userData, setuserData] = useState([]);
  const [name, setName] = useState("");
  const [phoneno, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [dob, setdateofBirth] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchInfo = async (e) => {
      const user = JSON.parse(localStorage.getItem("user"));
      setuserData(user);
      setName(user.name);
      setMobileNumber(user.phoneno);
      setAddress(user.address.street);
      setCity(user.address.city);
      setState(user.address.state);
      const formattedDateOfBirth = user.dob ? user.dob.split("T")[0] : "";
      setdateofBirth(formattedDateOfBirth);
      setGender(user.gender);
      setEmail(user.email);
    };

    fetchInfo();
  }, []);

  
  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
      <NurseSidebar profilePic={profilePic} userName={userData.name} />
        <div className="overflow-auto  justify-center items-center w-[70%] ms-24 p-4 flex flex-col ">
          <form className="flex flex-col w-[60%] gap-10" action="">
            <div>
              <p>Enter Patient Name:</p>
              <select
                id="doctors"
                className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Choose you Consultant">Choose Patient</option>
                <option value="D1">Patient 1</option>
                <option value="D2">Patient 2</option>
                <option value="D3">Patient 3</option>
              </select>
            </div>
            <textarea
              className="flex  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              type="text"
              rows="10"
              placeholder="Medicine Prescription"
            ></textarea>
            <button className="bg-black text-white w-[90%] p-2 rounded-full">
              Add Prescription
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default NurseMedication;
