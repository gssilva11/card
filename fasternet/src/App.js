// src/App.js
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import {
  Box, Button, TextField, Typography, Card, CardContent,
  Modal, Stack, Divider, Select, MenuItem, InputLabel, FormControl,
  IconButton
} from "@mui/material";

// Ícones
import EditIcon from "@mui/icons-material/Edit";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import HistoryIcon from "@mui/icons-material/History";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

export default function App() {
  const [user, setUser] = useState(Cookies.get("fn_user") || "");
  const [pass, setPass] = useState("");
  const [logged, setLogged] = useState(!!Cookies.get("fn_user"));
  const [theme, setTheme] = useState(Cookies.get("fn_theme") || "dark"); // tema salvo
  const [cards, setCards] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [updateText, setUpdateText] = useState("");

  const emptyForm = {
    trecho_cidade: "",
    tipo: "BACKBONE",
    descricao: "",
    ticket: "",
    afetacao: "",
    grupo_acionado: "",
    data_criacao: dayjs().format("YYYY-MM-DDTHH:mm"),
  };

  const [form, setForm] = useState(emptyForm);

  const bgColor = theme === "dark" ? "#181818" : "#f2f2f2";
  const textColor = theme === "dark" ? "#fff" : "#111";

  useEffect(() => {
    if (logged) loadCards();
  }, [logged]);

  useEffect(() => {
    Cookies.set("fn_theme", theme, { expires: 30 });
  }, [theme]);

  const calculateEscalations = (tipo, dataCriacao) => {
    const base = dayjs(dataCriacao);
    if (tipo === "POP") return { escala_1: null, escala_2: null, escala_3: null };
    const horas = tipo === "GPON" ? 12 : 4;
    return {
      escala_1: base.add(horas, "hour").toDate(),
      escala_2: base.add(horas * 2, "hour").toDate(),
      escala_3: base.add(horas * 3, "hour").toDate(),
    };
  };

  const getBaseColor = (tipo) =>
    ({
      BACKBONE: "#ff6159",
      PRIMARIA: "#9999ff",
      GPON: "#ffff99",
      POP: "#00cc00",
    }[tipo]);

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", user)
      .eq("password", pass)
      .single();

    if (error || !data) {
      alert("Usuário ou senha incorretos!");
      return;
    }
    Cookies.set("fn_user", user, { expires: 7 });
    setLogged(true);
    setPass("");
  };

  const handleLogout = () => {
    Cookies.remove("fn_user");
    setLogged(false);
    setUser("");
    setPass("");
    setCards([]);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const loadCards = async () => {
    const { data } = await supabase.from("cards").select("*").order("id", { ascending: false });
    if (data) setCards(data);
  };

  const reloadPage = () => setTimeout(() => window.location.reload(), 500);

  const createCard = async () => {
    try {
      const dataCriacao = new Date(form.data_criacao);
      const escalas = calculateEscalations(form.tipo, dataCriacao);
      const cor = getBaseColor(form.tipo);
      const { error } = await supabase.from("cards").insert([
        {
          trecho_cidade: form.trecho_cidade,
          tipo: form.tipo,
          descricao: form.descricao,
          ticket: form.ticket,
          afetacao: form.afetacao,
          grupo_acionado: form.grupo_acionado,
          data_criacao: dataCriacao,
          ...escalas,
          cor_atual: cor,
        },
      ]);
      if (error) throw error;
      setOpenCreate(false);
      resetForm();
      reloadPage();
    } catch {
      alert("Erro ao criar card.");
    }
  };

  const editCard = async () => {
    try {
      const dataCriacao = new Date(selected.data_criacao);
      const escalas = calculateEscalations(form.tipo, dataCriacao);
      const cor = getBaseColor(form.tipo);

      const { error } = await supabase
        .from("cards")
        .update({
          trecho_cidade: form.trecho_cidade,
          tipo: form.tipo,
          descricao: form.descricao,
          ticket: form.ticket,
          afetacao: form.afetacao,
          grupo_acionado: form.grupo_acionado,
          escala_1: escalas.escala_1,
          escala_2: escalas.escala_2,
          escala_3: escalas.escala_3,
          cor_atual: cor,
        })
        .eq("id", selected.id);
      if (error) throw error;
      setOpenEdit(false);
      reloadPage();
    } catch {
      alert("Erro ao editar card.");
    }
  };

  const deleteCard = async () => {
    if (deleteConfirm !== "excluir") {
      alert('Digite "excluir" para confirmar.');
      return;
    }
    const { error } = await supabase.from("cards").delete().eq("id", selected.id);
    if (error) return alert("Erro ao deletar.");
    setOpenDelete(false);
    reloadPage();
  };

  const loadUpdates = async (card) => {
    const { data } = await supabase
      .from("card_updates")
      .select("*")
      .eq("card_id", card.id)
      .order("data_registro", { ascending: true });
    return data || [];
  };

  const handleOpenUpdate = async (card) => {
    const updates = await loadUpdates(card);
    setSelected({ ...card, updates });
    setUpdateText("");
    setOpenUpdate(true);
  };

  const handleOpenHistory = async (card) => {
    const updates = await loadUpdates(card);
    setSelected({ ...card, updates });
    setOpenHistory(true);
  };

  const addUpdate = async () => {
    if (!updateText.trim()) return alert("Digite a atualização.");
    const { error } = await supabase.from("card_updates").insert([
      { card_id: selected.id, texto: updateText.trim() },
    ]);
    if (error) return alert("Erro ao salvar atualização.");
    setUpdateText("");
    reloadPage();
  };

  const resetForm = () =>
    setForm({
      trecho_cidade: "",
      tipo: "BACKBONE",
      descricao: "",
      ticket: "",
      afetacao: "",
      grupo_acionado: "",
      data_criacao: dayjs().format("YYYY-MM-DDTHH:mm"),
    });

  const openCreateModal = () => {
    resetForm();
    setOpenCreate(true);
  };

  const openEditModalWithCard = (card) => {
    setSelected(card);
    setForm({
      trecho_cidade: card.trecho_cidade,
      tipo: card.tipo,
      descricao: card.descricao,
      ticket: card.ticket,
      afetacao: card.afetacao,
      grupo_acionado: card.grupo_acionado,
      data_criacao: dayjs(card.data_criacao).format("YYYY-MM-DDTHH:mm"),
    });
    setOpenEdit(true);
  };

console.log("URL Supabase:", process.env.REACT_APP_SUPABASE_URL);
console.log("KEY Supabase:", process.env.REACT_APP_SUPABASE_KEY);


  if (!logged)
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: bgColor, color: textColor, p: 6 }}>
        <Box sx={{ maxWidth: 360, mx: "auto", bgcolor: "#fff", color: "#000", p: 4, borderRadius: 2 }}>
          <Typography variant="h5" mb={2}>Login Fasternet</Typography>
          <TextField label="Usuário" fullWidth value={user} onChange={(e) => setUser(e.target.value)} sx={{ mb: 1 }} />
          <TextField label="Senha" type="password" fullWidth value={pass} onChange={(e) => setPass(e.target.value)} sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="contained" onClick={handleLogin}>Entrar</Button>
          </Stack>
        </Box>
      </Box>
    );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: bgColor, color: textColor, p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">📡 Fasternet - Cards</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="contained" onClick={openCreateModal}>+ Novo Card</Button>
          <IconButton onClick={toggleTheme} sx={{ color: textColor }} title="Alternar tema">
            {theme === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton onClick={handleLogout} sx={{ color: textColor }} title="Sair">
            <LogoutIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={3}>
        {cards.map((c) => (
          <Card
            key={c.id}
            sx={{
              backgroundColor: c.cor_atual || getBaseColor(c.tipo),
              borderRadius: 3,
              boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
              maxWidth: 520,
              color: "#111",
              fontWeight: 600,
              mx: "auto",
              p: 1.5,
            }}
          >
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{c.trecho_cidade}</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{c.tipo}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontWeight: 600, fontSize: "1.1rem" }}>{c.descricao}</Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>🏷️ Ticket: {c.ticket || "-"}</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>⚠️ {c.afetacao || "-"} Cliente(s)</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>👥 Grupo: {c.grupo_acionado || "-"}</Typography>
              <Typography variant="caption" display="block" mt={1} sx={{ fontWeight: 600 }}>
                Criado em: {dayjs(c.data_criacao).format("DD/MM/YYYY HH:mm")}
              </Typography>

              <Stack direction="row" spacing={1.5} mt={2}>
                <IconButton onClick={() => openEditModalWithCard(c)}><EditIcon sx={{ fontSize: 34, color: "#000" }} /></IconButton>
                <IconButton onClick={() => handleOpenUpdate(c)}><NoteAddIcon sx={{ fontSize: 34, color: "#000" }} /></IconButton>
                <IconButton onClick={() => handleOpenHistory(c)}><HistoryIcon sx={{ fontSize: 34, color: "#000" }} /></IconButton>
                <IconButton onClick={() => { setSelected(c); setDeleteConfirm(""); setOpenDelete(true); }}><DeleteIcon sx={{ fontSize: 34, color: "#000" }} /></IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ---- Modais ---- */}
      <Modal open={openCreate} onClose={() => { setOpenCreate(false); resetForm(); }}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>📝 Novo Card</Typography>
          <CardForm form={form} setForm={setForm} onSubmit={createCard} onCancel={() => { setOpenCreate(false); resetForm(); }} disableDate={false} />
        </Box>
      </Modal>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>✏️ Editar Card</Typography>
          <CardForm form={form} setForm={setForm} onSubmit={editCard} onCancel={() => setOpenEdit(false)} disableDate={true} />
        </Box>
      </Modal>

      <Modal open={openUpdate} onClose={() => setOpenUpdate(false)}>
        <Box sx={modalStyle}>
          {selected && (
            <>
              <Typography variant="h6">{selected.trecho_cidade}</Typography>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ maxHeight: 240, overflowY: "auto", mb: 2 }}>
                {selected.updates?.length > 0
                  ? selected.updates.map((u) => (
                      <Box key={u.id} sx={{ mb: 1, p: 1, bgcolor: "#fff", borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ color: "#111" }}>{u.texto}</Typography>
                        <Typography variant="caption" sx={{ color: "#444" }}>{dayjs(u.data_registro).format("DD/MM HH:mm")}</Typography>
                      </Box>
                    ))
                  : <Typography>Nenhuma atualização.</Typography>}
              </Box>
              <TextField fullWidth multiline minRows={4} label="Nova atualização" value={updateText} onChange={(e) => setUpdateText(e.target.value)} sx={{ mb: 2 }} />
              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button onClick={() => setOpenUpdate(false)}>Fechar</Button>
                <Button variant="contained" onClick={addUpdate}>Salvar</Button>
              </Stack>
            </>
          )}
        </Box>
      </Modal>

      <Modal open={openHistory} onClose={() => setOpenHistory(false)}>
        <Box sx={modalStyle}>
          {selected && (
            <>
              <Typography variant="h6">{selected.trecho_cidade}</Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
                {selected.updates?.length > 0
                  ? selected.updates.map((u) => (
                      <Box key={u.id} sx={{ mb: 1, p: 1, bgcolor: "#fff", borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ color: "#111" }}>{u.texto}</Typography>
                        <Typography variant="caption" sx={{ color: "#444" }}>{dayjs(u.data_registro).format("DD/MM HH:mm")}</Typography>
                      </Box>
                    ))
                  : <Typography>Nenhuma atualização registrada.</Typography>}
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <Modal open={openDelete} onClose={() => setOpenDelete(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2} color="error">❌ Confirmar exclusão</Typography>
          <Typography>Digite <b>excluir</b> para confirmar.</Typography>
          <TextField fullWidth value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value.toLowerCase())} sx={{ my: 2 }} />
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={deleteCard}>Excluir</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "#ffffff",
  p: 3,
  borderRadius: 2,
  width: 600,
  boxShadow: 24,
};

function CardForm({ form, setForm, onSubmit, onCancel, disableDate }) {
  return (
    <Stack spacing={2}>
      <TextField label="Trecho / Cidade" value={form.trecho_cidade} onChange={(e) => setForm({ ...form, trecho_cidade: e.target.value.toLocaleUpperCase() })} />
      <FormControl fullWidth>
        <InputLabel>Tipo</InputLabel>
        <Select value={form.tipo} label="Tipo" onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          <MenuItem value="BACKBONE">BACKBONE</MenuItem>
          <MenuItem value="PRIMARIA">PRIMÁRIA</MenuItem>
          <MenuItem value="GPON">GPON</MenuItem>
          <MenuItem value="POP">POP</MenuItem>
                </Select>
      </FormControl>
      <TextField
        label="Descrição"
        multiline
        minRows={3}
        value={form.descricao}
        onChange={(e) => setForm({ ...form, descricao: e.target.value.toUpperCase() })}
      />
      <TextField
        label="Ticket"
        value={form.ticket}
        onChange={(e) => setForm({ ...form, ticket: e.target.value.toUpperCase() })}
      />
      <TextField
        label="Afetação"
        value={form.afetacao}
        onChange={(e) => setForm({ ...form, afetacao: e.target.value.toUpperCase() })}
      />
      <TextField
        label="Grupo Acionado"
        value={form.grupo_acionado}
        onChange={(e) => setForm({ ...form, grupo_acionado: e.target.value.toUpperCase() })}
      />
      {!disableDate && (
        <TextField
          label="Data de Criação"
          type="datetime-local"
          value={form.data_criacao}
          onChange={(e) => setForm({ ...form, data_criacao: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      )}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit}>Salvar</Button>
      </Stack>
    </Stack>
  );
}
