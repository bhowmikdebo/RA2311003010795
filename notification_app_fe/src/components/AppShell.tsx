"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ViewListIcon from "@mui/icons-material/ViewList";
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname() ?? "/";
  const isPriority = pathname.startsWith("/priority");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar sx={{ gap: 2, minHeight: { xs: 64, sm: 72 } }}>
          <NotificationsActiveIcon color="primary" />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }} noWrap>
              Campus Notifications
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              href="/"
              variant={!isPriority ? "contained" : "text"}
              startIcon={<ViewListIcon />}
            >
              All
            </Button>
            <Button
              component={Link}
              href="/priority"
              variant={isPriority ? "contained" : "text"}
              startIcon={<PriorityHighIcon />}
            >
              Priority
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
          {title}
        </Typography>
        {children}
      </Container>
    </Box>
  );
}
