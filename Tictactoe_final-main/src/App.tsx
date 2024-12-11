import React from 'react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import TicTacToe from './TicTacToe';
import Login from './Login';

/*
	This component initializes the application by displaying a loading indicator
  while fetching configuration data from the server. Once the data is retrieved,
  it determines the initial view of the application.
  Note: In most cases, the loading spinner will appear very briefly.
*/

let config : any;

function showError(e : any)
{
	console.log("Configuration error:", e);;
}

function App() {
	const [view, setView] = useState("init");
	const [user, setUser] = useState(null);
  
	const configureApp = (c: any) => {
	  config = c;
	  setView("login"); 
	};
  
	useEffect(() => {
	  fetch("/config.json", { method: "GET", mode: "cors", credentials: "include" })
		.then((r) => r.json())
		.then((j) => configureApp(j))
		.catch((e) => showError(e));
	}, []);
  

    if (view === "init") {
        return <CircularProgress />;
    } else if (view === "login") {
        return <Login />;
    } else if (view === "game") {
        return <TicTacToe config={config} user={user} />;
    } else {
        return <div>Error: Unknown view</div>;
    }
  }



export default App;
