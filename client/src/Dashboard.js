import { useState, useEffect } from "react"
import useAuth from "./useAuth"
import Player from "./Player"
import TrackSearchResult from "./TrackSearchResult"
import { Container, Form } from "react-bootstrap"
import SpotifyWebApi from "spotify-web-api-node"
import axios from "axios"
import content from "./content/index.js"
// import Dashnav from "./Dashnav"
const spotifyApi = new SpotifyWebApi({
  clientId: "8b945ef10ea24755b83ac50cede405a0",
})

export default function Dashboard({ code }) {
  const accessToken = useAuth(code)

  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [playingTrack, setPlayingTrack] = useState()
  const [lyrics, setLyrics] = useState("")
  const [saved, setSaved] = useState([])
  function chooseTrack(track) {
    setPlayingTrack(track)
    setSearch("")
    setLyrics("")
  }

  useEffect(() => {
    if (!playingTrack) return

    axios
      .get("http://localhost:3001/lyrics", {
        params: {
          track: playingTrack.title,
          artist: playingTrack.artist,
        },
      })
      .then(res => {
        setLyrics(res.data.lyrics)
      })
  }, [playingTrack])

  useEffect(() => {
    if (!accessToken) return
    spotifyApi.setAccessToken(accessToken)
  }, [accessToken])

  useEffect(() => {
    if (!search) return setSearchResults([])
    if (!accessToken) return

    let cancel = false
    spotifyApi.searchTracks(search).then(res => {
      if (cancel) return
      setSearchResults(
        res.body.tracks.items.map(track => {
          const smallestAlbumImage = track.album.images.reduce(
            (smallest, image) => {
              if (image.height < smallest.height) return image
              return smallest
            },
            track.album.images[0]
          )

          return {
            artist: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImage.url,
          }
        })
      )
    })

    return () => (cancel = true)
  }, [search, accessToken])
  // let user = '';
  // spotifyApi.getMe()
  //   .then(function (data) {
  //     console.log('Some information about the authenticated user', data.body.id);
  //     user = data.body.id;
  //   }, function (err) {
  //     console.log('Something went wrong!', err);
  //   });
  useEffect(() => {

    spotifyApi.getMySavedTracks({
      limit: 20,
      offset: 1
    })
      .then(function (data) {
        setSaved(data.body.items.map((tracks) => {

          return {
            album: tracks.track.album,
            artists: tracks.track.artists[0],
            name: tracks.track.name,
            uri: tracks.track.uri,
          }
        }

        ))
        console.log('Done!', saved);
      }, function (err) {
        console.log('Something went wrong!', err);
      });

  }, [saved, accessToken])
  return (
    <Container className="d-flex flex-column py-2 " style={{ height: "100vh", minWidth: "100vw", backgroundColor: '#F7BF50', }}>
      <div className="d-flex justify-content-between align-items-center px-4 py-2">
        <img src={content.nav.logo} height="50rem" alt="bangeralert for Navbar" className='buttonHover' />
        <Form.Control
          type="search"
          className="w-25"
          placeholder="Search Songs/Artists"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div>
        {saved.map((track) => {
          return <div className="d-flex">{track.name}</div>

        }

        )}
      </div>


      <div className="d-flex justify-content-center h-100
       overflow-y-auto ">
        {/* <Dashnav /> */}

        <div className="flex-grow-1 my-2 " style={{ overflowY: "auto" }}>
          {searchResults.length === 0 && (
            <div className="text-center" style={{ whiteSpace: "pre", overflowY: "auto" }}>
              {lyrics}
            </div>
          )}
          {searchResults.map(track => (
            <TrackSearchResult
              track={track}
              key={track.uri}
              chooseTrack={chooseTrack}
            />
          ))}
        </div>
      </div>
      <div className='fixed-bottom '>
        <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
    </Container >
  )
}
