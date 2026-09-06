import React from "react";
import { Box } from "@mui/material";

function QueensMatchLogo({ height = 48, sx = {} }) {
  return (
    <Box
      component="img"
      src="/queen-match-logo.png"
      alt="Queen Match By QueenB"
      sx={{
        display: "block",
        height,
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain",
        ...sx,
      }}
    />
  );
}

export default QueensMatchLogo;