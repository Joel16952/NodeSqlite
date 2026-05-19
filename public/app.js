const artistForm = document.getElementById("artist-form");
const albumForm = document.getElementById("album-form");
const songForm = document.getElementById("song-form");

const carregarartistes = document.getElementById("carregarartistes");
const carregaralbums = document.getElementById("carregaralbums");
const carregarcançons = document.getElementById("carregarcançons");

const artistOutput = document.getElementById("consultar");

const artistNameInput = document.getElementById("artist-name");
const albumTitleInput = document.getElementById("album-title");
const albumArtistSelect = document.getElementById("album-artist");
const songNameInput = document.getElementById("song-name");
const songAlbumSelect = document.getElementById("song-album");

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

async function CridaSelectBackend(table) {
  const response = await postJson(`/api/${table}`, { data: table });
  return response.data.result || [];
}

albumArtistSelect.addEventListener("focus", async () => {
  albumArtistSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Selecciona un artista";
  albumArtistSelect.appendChild(emptyOption);

  let artists = await CridaSelectBackend("artists");
  artists.forEach((artist) => {
    let opcio = document.createElement("option");
    opcio.value = artist.id;
    opcio.textContent = artist.name;
    albumArtistSelect.appendChild(opcio);
  });
});

songAlbumSelect.addEventListener("focus", async () => {
  songAlbumSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Selecciona un album";
  songAlbumSelect.appendChild(emptyOption);

  let albums = await CridaSelectBackend("albums");
  albums.forEach((album) => {
    let opcio = document.createElement("option");
    opcio.value = album.id;
    opcio.textContent = album.title;
    songAlbumSelect.appendChild(opcio);
  });
});

artistForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = artistNameInput.value.trim();
  if (!name) return;

  const response = await postJson("/api/AddArtist", { data: name });
  artistOutput.textContent = response.data;

  if (response.ok) {
    artistForm.reset();
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
  const rows = await CridaSelectBackend("artists");
  showResult(rows);
});

carregaralbums.addEventListener("click", async () => {
  const rows = await CridaSelectBackend("albums");
  showResult(rows);
});

carregarcançons.addEventListener("click", async () => {
  const response = await postJson("/api/songs", {});
  showResult(response.data.result || []);
});
