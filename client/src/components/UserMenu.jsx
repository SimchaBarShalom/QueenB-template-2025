import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, Divider, IconButton, ListItemIcon, Menu, MenuItem, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { getSwitchableAreas } from "../utils/areaRouting";

function UserMenu({ currentUser, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const switchableAreas = getSwitchableAreas(currentUser, location.pathname);

  const handleClose = () => setAnchorEl(null);

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
    navigate("/");
  };

  const initial = currentUser?.fullName?.trim()?.[0] || "?";

  return (
    <>
      <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} size="small" sx={{ p: 0.3 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontWeight: 700 }}>{initial}</Avatar>
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem disabled sx={{ opacity: "1 !important" }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
            {currentUser.fullName}
          </Typography>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleNavigate("/profile")}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          פרופיל
        </MenuItem>

        {switchableAreas.map((area) => (
          <MenuItem key={area.path} onClick={() => handleNavigate(area.path)}>
            <ListItemIcon>
              <SwapHorizIcon fontSize="small" />
            </ListItemIcon>
            {area.label}
          </MenuItem>
        ))}

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          התנתקות
        </MenuItem>
      </Menu>
    </>
  );
}

export default UserMenu;
