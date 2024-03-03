import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import profiePic from "../../assets/human6.jpg";
import axios from "axios";
import Swal from "sweetalert2";
import AdminSidebar from "./AdminSidebar";

function AdminNewsletter() {

  const [subscribers, setSubscribers] = useState([]);

  const fetchSentMessages = async () => {
    try {
      await axios.get(
        "https://hmsmern.onrender.com/admin/get-sent-newsletter"
      )
      .then((res) =>{
        setSubscribers(res.data);
      })
      
    } catch (err) {
      Swal.fire({
        title: "Error",
        icon: "error",
        text: "Error Fetching Data!",
      });
    }
  };

  useEffect(() => {
    fetchSentMessages();
  }, []);


  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
      <AdminSidebar userName={"Admin"} profiePic={profiePic}/>

      <div className=" w-[70%] ms-24 p-4 flex flex-col justify-start gap-5 ">
          <p className="font-semibold text-3xl">Subscriber</p>
          <div className="w-full">
            <div className="relative overflow-auto shadow-md sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Subscriber's Email
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((email , index) =>{
                    return(
                      <tr key={index} className="text-black">
                        <td scope="col" className="px-6 py-3">
                          {index + 1}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {email.email}
                        </td>

                        
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
    
        </div>
      </div>
    </section>
  );
}

export default AdminNewsletter;
