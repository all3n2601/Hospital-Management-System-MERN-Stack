import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import profiePic from "../../../assets/doct2.jpg";
import axios from "axios";
import Swal from "sweetalert2";
import DoctorSidebar from "./DoctorSidebar";
import { useSelector } from "react-redux";

function DoctorAppointmen() {
  const [appointments, setAppointments] = useState([]);

  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://hmsmern.onrender.com/appointment/get-appointment/${currentUser._id}`
        );
        setAppointments(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
        <DoctorSidebar userName={currentUser.name} profiePic={profiePic} />
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
                      Patient Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Appointment Date
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Appointment Time
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments &&
                  Array.isArray(appointments) &&
                  appointments.length > 0 ? (
                    appointments.map((item, index) => (
                      <tr key={item._id} className="text-black">
                        <td scope="col" className="px-6 py-3">
                          {index + 1}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.patient}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.appointmentDate}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.time}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.status}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-3" colSpan="5">
                        <p>Sorry, You have No appointments !!</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DoctorAppointmen;
