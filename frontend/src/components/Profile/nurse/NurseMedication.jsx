import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import profilePic from "../../../assets/doct5.jpg";
import axios from "axios";
import Swal from "sweetalert2";
import NurseSidebar from "./NurseSidebar";

function NurseMedication() {
  const [userData, setuserData] = useState([]);
  const [patients , setPatients] = useState([]);
  const [name , setName] = useState("");
  const [frequency , setFrequency] =useState("");
  const [dosage , setDosage] = useState("");
  const [changePatient , setChangePatient] = useState("");



  useEffect(() => {
    const fetchInfo = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      setuserData(user);
    };

    fetchInfo();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("https://hmsmern.onrender.com/user/get-users");
        setPatients(response.data);
        
      } catch (error) {
        console.error('Error fetching users:', error);

      }
    };
  
    fetchData();
  
  }, []); 

  const handleAddMedication = async(e) =>{
    e.preventDefault() ;
    await axios.post(`https://hmsmern.onrender.com/user/add-medications/${changePatient}`,{name ,  frequency , dosage})
    .then((res) =>{
      Swal.fire({
        title: "Success",
        icon: "success",
        confirmButtonText: "Ok",
        text: "Medication added successfully",
      });
    })
    .catch((error) =>{
      Swal.fire({
        title: "Invalid Credentials!",
        icon: "error",
        confirmButtonText: "Ok",
        text: "Please Check Your Credentials and Try Again!",
      });
    })

  }
  

  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
      <NurseSidebar profilePic={profilePic} userName={userData.name} />
        <div className="overflow-auto  justify-center items-center w-[70%] ms-24 p-4 flex flex-col ">
          <form className="flex flex-col w-[60%] gap-5" action="">
            <div>
              <p>Enter Patient Name:</p>
              <select
                id="doctors"
                onChange={(e) => setChangePatient(e.target.value)}
                className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {patients.map((value , index) =>{
                  return(
                    <option value={value.email}>{value.userName}</option>
                  )
                })}
              </select>
            </div>
            <div>
              <p>Name Of Medicine: </p>
            <input
              className="flex  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              type="text"
              placeholder="Medicine"
              onChange={(e) => setName(e.target.value)}
            ></input>
            </div>
            <div>
              <p>Dosage: </p>
            <input
              className="flex  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              type="text"
              placeholder="(Ml , Tablets)"
              onChange={(e) => setDosage(e.target.value)}
            ></input>
            </div>
              <div>
                <p>Frequency: </p>
            <input
              className="flex  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              type="text"
              placeholder="2 Times a  Day..etc"
              onChange={(e) => setFrequency(e.target.value)}
            ></input>
            </div>
            <button className="bg-black text-white w-[90%] p-2 rounded-full"
            onClick={handleAddMedication}>
              Add Prescription
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default NurseMedication;
