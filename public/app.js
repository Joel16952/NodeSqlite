const artistForm = document.getElementById("artistform");
const albumForm = document.getElementById("albumform");
const songForm = document.getElementById("songform");

const carregarartistes = document.getElementById("carregarartistes");
const carregaralbums = document.getElementById("carregaralbums");
const carregarcançons = document.getElementById("carregarcançons");

const artistOutput = document.getElementById("consultar");

const artistNameInput = document.getElementById("artistname");
const albumTitleInput = document.getElementById("albumtitle");
const albumArtistSelect = document.getElementById("albumartist");
const songNameInput = document.getElementById("songname");
const songAlbumSelect = document.getElementById("songalbum");

async function postJson(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return { ok: res.ok, data: await res.json() };
  }

  return { ok: res.ok, data: await res.text() };
}

function showResult(result) {
  artistOutput.textContent = JSON.stringify(result, null, 2);
}

function fillSelect(select, rows, valueField, textField, emptyText) {
  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = emptyText;
  select.appendChild(emptyOption);

  rows.forEach((row) => {
    const option = document.createElement("option");
    option.value = row[valueField];
    option.textContent = row[textField];
    select.appendChild(option);
  });
}

async function loadArtists() {
  const response = await postJson("/api/artists", { data: "artists" });
  const rows = response.data.result || [];
  fillSelect(albumArtistSelect, rows, "id", "name", "Selecciona un artista");
  return rows;
}

async function loadAlbumsForSelect() {
  const response = await postJson("/api/albums", {});
  const rows = response.data.result || [];
  fillSelect(songAlbumSelect, rows, "id", "title", "Selecciona un album");
  return rows;
}

artistForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = artistNameInput.value.trim();
  if (!name) return;

  const response = await postJson("/api/AddArtist", { data: name });
  artistOutput.textContent = response.data;

  if (response.ok) {
    artistForm.reset();
    await loadArtists();
  }
});

albumForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = albumTitleInput.value.trim();
  const artistId = albumArtistSelect.value;
  if (!title || !artistId) return;

  const response = await postJson("/api/AddAlbum", {
    title,
    artist_id: artistId
  });
  artistOutput.textContent = response.data;

  if (response.ok) {
    albumForm.reset();
    await loadAlbumsForSelect();
  }
});

songForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = songNameInput.value.trim();
  const albumId = songAlbumSelect.value;
  if (!name || !albumId) return;

  const response = await postJson("/api/AddSong", {
    name,
    album_id: albumId
  });
  artistOutput.textContent = response.data;

  if (response.ok) {
    songForm.reset();
  }
});

carregarartistes.addEventListener("click", async () => {
  const rows = await loadArtists();
  showResult(rows);
});

carregaralbums.addEventListener("click", async () => {
  const rows = await loadAlbumsForSelect();
  showResult(rows);
});

carregarcançons.addEventListener("click", async () => {
  const response = await postJson("/api/songs", {});
  showResult(response.data.result || []);
});

