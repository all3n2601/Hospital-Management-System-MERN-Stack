import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import profiePic from "../../assets/human6.jpg";
import axios from "axios";

function AdminDoctor() {
  const [doctors, setDoctors] = useState([]);
  const userString = localStorage.getItem("user");
  const userObject = JSON.parse(userString);

  const [docname, setDocName] = useState("");
  const [docid, setDocId] = useState("");
  const [docdept, setDocDept] = useState("");
  const [docemail, setDocEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4451/doctor/get-doctors"
        );
        setDoctors(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    fetchData();
  }, []); 

  if (!doctors) {
    return <Loader />;
  }

  const handleAddDoctor = async (e) => {
    try {
      const res = await axios.post("http://localhost:4451/doctor/add-doctor",{
        name:docname,
        doctorId:docid,
        specialization:docdept,
        email:docemail

      });
    } catch (err) {
      console.log(err);
    }
  };

  const navLinkStyle = ({ isActive }) => {
    return {
      fontWeight: isActive ? "600" : "400",
      color: isActive ? "white" : "black",
      backgroundColor: isActive ? "black" : "white",
    };
  };

  const [isCreate, setIsCreate] = useState(false);

  const editPatient = async (id) => {
    await axios
      .put(`http://localhost:4451/doctor/update-doctor/${id}`, {})
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const deletePatient = async (id) => {
    await axios
      .delete(`http://localhost:4451/doctor/delete-doctor/${id}`, {})
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCreate = () => {
    setIsCreate(!isCreate);
  };

  const handleGoBack = () => {
    setIsCreate(!isCreate);
  };

  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
        <div className="bg-slate- h-full w-[18%] flex flex-col justify-between p-2 ">
          <div className="flex flex-col gap-6">
            <div className="w-full flex flex-col items-center ">
              <img
                src={profiePic}
                className="size-24 rounded-full"
                alt="profile"
              />
              <p className="font-semibold text-xl">Admin</p>
            </div>
            <div className="flex flex-col items-start w-full gap-3 ">
              <NavLink
                style={navLinkStyle}
                className={"w-full   p-2 h-[40px] "}
                to="/admin-dashboard"
              >
                Dashboard
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full  p-2 h-[40px] "}
                to="/admin-doctor"
              >
                Doctor
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full p-2 h-[40px] "}
                to="/admin-nurse"
              >
                Nurse
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full p-2 h-[40px] "}
                to="/admin-patient"
              >
                Patient
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full p-2 h-[40px] "}
                to="/admin-query"
              >
                Query
              </NavLink>
              <NavLink
                style={navLinkStyle}
                className={"w-full p-2 h-[40px] "}
                to="/admin-newsletter"
              >
                Newsletter
              </NavLink>
            </div>
          </div>
          <div className="w-full text-center  h-[80px] p-2">
            <button className="bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-110 duration-200 active:scale-90 ">
              Sign Out
            </button>
          </div>
        </div>
        <div className=" w-[70%] ms-24 p-4 flex flex-col justify-start gap-5 ">
          <p className="font-semibold text-3xl">Doctors</p>
          <div className="w-full">
            <div className="relative overflow-auto shadow-md sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Doctor Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Doctor Email
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {doctors &&
                    doctors.map((item, index) => (
                      <tr key={item.id}>
                        <td scope="col" className="px-6 py-3">
                          {item.doctorId}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.name}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.email}
                        </td>
                        <td scope="col" className="px-6 py-3">
                          {item.specialization}
                        </td>
                        <td scope="col" className="d-flex gap-3 ">
                          <button
                            onClick={() => {
                              editPatient(item.id);
                            }}
                            className="btn btn-success"
                          >
                            Edit
                          </button>
                          <br />
                          <button
                            onClick={() => {
                              deletePatient(item.id);
                            }}
                            className="btn btn-danger"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="bg-slate-900 p-2 w-[10%] rounded-full hover:scale-110 duration-200 active:scale-90  text-white"
          >
            Create
          </button>
        </div>
        {isCreate && (
          <div className="absolute h-[78%] w-[79%] z-50 bg-white">
            <form className="flex flex-col w-full h-full justify-center gap-4 items-center">
              <div className="flex flex-col w-[40%] items-center ">
                <p className="">Enter Doctors Name:</p>
                <input
                  onChange={(e) => setDocName(e.target.value)}
                  className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="Doctor Name"
                ></input>
              </div>
              <div className="flex flex-col w-[40%] items-center ">
                <p className="">Enter Doctors ID:</p>
                <input
                  onChange={(e) => setDocId(e.target.value)}
                  className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="ID"
                ></input>
              </div>
              <div className="flex flex-col w-[40%] items-center ">
                <p className="">Enter Doctors Email:</p>
                <input
                  onChange={(e) => setDocEmail(e.target.value)}
                  className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="Email"
                ></input>
              </div>
              <div className="flex flex-col w-[40%] items-center ">
                <p className="">Enter Doctors Department:</p>
                <input
                  onChange={(e) => setDocDept(e.target.value)}
                  className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="Department"
                ></input>
              </div>

              <button onClick={ handleAddDoctor} className=" w-[35%] bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-110 duration-200 active:scale-90">
                Add Doctor
              </button>

              <button
                onClick={handleGoBack}
                className="bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-105 duration-200 active:scale-90"
              >
                {"<- Go back"}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminDoctor;
