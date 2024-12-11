import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

interface NavbarProps {
  onLogout: () => void;  // Kullanıcı çıkış yapacak fonksiyon
  username: string | undefined; // Kullanıcı adı, undefined olabilir
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, username }) => {
  return (
    <AppBar position="static"> {/* Statik bir AppBar yerleştiriyor */}
      <Toolbar> {/* AppBar içeriğini hizalar */}
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          TicTacToe Game - Welcome! {/* Ana başlık */}
        </Typography>
        <Typography variant="body1" style={{ marginRight: '20px' }}>
          {username ? `Logged in as: ${username}` : 'Not logged in'} {/* Kullanıcı adı varsa, "Logged in as:" gösterir, yoksa 'Not logged in' */}
        </Typography>
        <Button color="inherit" onClick={onLogout}> {/* Çıkış butonu */}
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
