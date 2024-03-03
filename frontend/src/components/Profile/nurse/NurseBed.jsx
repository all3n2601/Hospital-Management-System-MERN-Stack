import React,{useState, useEffect} from "react";
import { NavLink } from "react-router-dom";
import profilePic from "../../../assets/doct5.jpg";
import axios from "axios";
import Swal from "sweetalert2";
import NurseSidebar from "./NurseSidebar";
import { useSelector } from "react-redux";

function NurseBed() {
 

  

  const [message ,  setMessage] = useState([]);


  const {currentUser} = useSelector((state) => state.user)



  

  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.get(`https://hmsmern.onrender.com/doctor/get-message/${currentUser.email}`)
        .then((res) =>{
          setMessage(res.data);

        })  
        
      } catch (error) {
        console.error('Error fetching users:', error);

      }
    };
  
    fetchData();
  
  }, []);

  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
        <NurseSidebar profilePic={profilePic} userName={currentUser.name} />
        <div className=" w-[70%] ms-24 p-4 flex flex-col justify-start gap-5 ">
          <p className="font-semibold text-3xl">Appointments</p>
          <div className="w-full">
            <div className="relative overflow-auto shadow-md sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3">
                      From
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Message
                    </th>
                    
                  </tr>
                </thead>
                <tbody>
                  {message ?
                    message.map((item, index) => (
                      <tr key={index} className="text-black">
                        <td scope="col" className="px-6 py-3">
                          {index+1}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.from}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.message}
                        </td>
                         
                      </tr>
                    )):<p>Inbox is Empty !!</p>}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

export default NurseBed;
