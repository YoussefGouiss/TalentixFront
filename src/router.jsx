import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import WelcomPage from './Admin/pages/welcom';
 const route = createBrowserRouter([
        {
            path :'/',
            element : <WelcomPage/>
        }
    ])
 export default route;



