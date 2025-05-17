import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
export default function WelcomePage() {
  const [loaded, setLoaded] = useState(false);
  const [hoverEmployee, setHoverEmployee] = useState(false);
  const [hoverAdmin, setHoverAdmin] = useState(false);
  
  // Animation effect that runs once when component mounts
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="bg-no-repeat bg-cover bg-center w-full h-screen fixed overflow-hidden font-sans" 
         style={{ backgroundImage: "url('bgWelcomPage.png')" }}>
      <div className='flex flex-col justify-center items-center gap-1'>
        <h1 className='text-center text-[#4B7569] text-4xl font-bold mt-4'>Selectionnez votre Role</h1>
      <div className='h-1 w-44 bg-[#4B7569]'></div></div>
      
      <div className='flex items-center justify-center gap-40 h-full'>
        {/* Employee Card */}
        <div 
          className={`bg-white border-2 border-[#7AC9B3] w-1/4 h-[35rem] flex flex-col gap-10 items-center transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            boxShadow: hoverEmployee 
              ? '0 20px 25px -5px rgba(122, 201, 179, 0.5), 0 0 15px 5px rgba(122, 201, 179, 0.3), 0 0 0 2px rgba(122, 201, 179, 0.2)' 
              : '0 10px 15px -3px rgba(122, 201, 179, 0.3)',
            transform: hoverEmployee ? 'translateY(-10px) scale(1.03)' : 'translateY(0) scale(1)',
            transition: 'transform 0.5s ease, box-shadow 0.5s ease'
          }}
          onMouseEnter={() => setHoverEmployee(true)}
          onMouseLeave={() => setHoverEmployee(false)}
        >
          <img 
            src='vec5 1.png' 
            className='w-[60%] mt-20 transition-all duration-500' 
            style={{ 
              transform: hoverEmployee ? 'scale(1.1)' : 'scale(1)',
              filter: hoverEmployee ? 'drop-shadow(0 0 8px rgba(122, 201, 179, 0.8))' : 'none'
            }}
            alt="Employee icon" 
          />

          <Link to='/employe/login'>
          <button 
            className='bg-[#7AC9B3] text-white p-3 rounded-lg px-5 transition-all duration-300'
            style={{
              transform: hoverEmployee ? 'scale(1.15)' : 'scale(1)',
              boxShadow: hoverEmployee ? '0 0 15px rgba(122, 201, 179, 0.8)' : 'none'
            }}
          >
            Je suis un Employe
          </button>
          </Link>
        </div>
        
        {/* Admin Card */}
        <div 
          className={`bg-white border-2 border-[#7AC9B3] w-1/4 h-[35rem] flex flex-col gap-[56px] items-center transition-all duration-500 ${loaded ? 'opacity-100 delay-200' : 'opacity-0'}`}
          style={{ 
            boxShadow: hoverAdmin 
              ? '0 20px 25px -5px rgba(122, 201, 179, 0.5), 0 0 15px 5px rgba(122, 201, 179, 0.3), 0 0 0 2px rgba(122, 201, 179, 0.2)' 
              : '0 10px 15px -3px rgba(122, 201, 179, 0.3)',
            transform: hoverAdmin ? 'translateY(-10px) scale(1.03)' : 'translateY(0) scale(1)',
            transition: 'transform 0.5s ease, box-shadow 0.5s ease'
          }}
          onMouseEnter={() => setHoverAdmin(true)}
          onMouseLeave={() => setHoverAdmin(false)}
        >
          <img 
            src='vec6 2.png' 
            className='w-[72%] mt-20 transition-all duration-500' 
            style={{ 
              transform: hoverAdmin ? 'scale(1.1)' : 'scale(1)',
              filter: hoverAdmin ? 'drop-shadow(0 0 8px rgba(122, 201, 179, 0.8))' : 'none'
            }}
            alt="Admin icon" 
          />
          <Link to='/admin/login'>
          <button 
            className='bg-[#7AC9B3] text-white p-3 rounded-lg px-7 transition-all duration-300'
            style={{
              transform: hoverAdmin ? 'scale(1.15)' : 'scale(1)',
              boxShadow: hoverAdmin ? '0 0 15px rgba(122, 201, 179, 0.8)' : 'none'
            }}
          >
            Je suis un Admin
          </button>
          </Link>
        </div>
      </div>
    </div>
  )
}