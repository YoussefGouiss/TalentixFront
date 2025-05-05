import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import WelcomPage from './Admin/pages/welcom';
import AdminLogin from './Admin/pages/auth/Adminlogin';
import EmployeeLogin from './Admin/pages/auth/Employeelogin';
import MainLayoute from './Admin/layoute/main';
import DashbordAdmin from './Admin/pages/Dashbord/DashbordAdmin';
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
        {
            path : 'admin',
            element : <MainLayoute/>,
            children :[
                {
                    index : true,
                    element  : <DashbordAdmin/>
                }
            ]
        }

        
    ])
 export default route;



