import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import WelcomPage from './Admin/pages/welcom';
import AdminLogin from './Admin/pages/auth/Adminlogin';
import EmployeeLogin from './Admin/pages/auth/Employeelogin';
 const route = createBrowserRouter([
        {
            path :'/',
            element : <WelcomPage/>
        },
        {
            path :'/adminlogin',
            element : <AdminLogin/>
        },
        {
            path :'/employeelogin',
            element : <EmployeeLogin/>
        },
        
    ])
 export default route;



