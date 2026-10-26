import VideoTile from './VideoTile';

// Decides how many columns to use for a given number of people.
function getColumns(count, isPhone) {
  if (isPhone) return count <= 2 ? 1 : 2;
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

// Lays out all participants in a responsive grid. `participants` is a list of objects
// with: id, name, stream, micOn, videoOn, isLocal, mirrored, connectionState
export default function VideoGrid({ participants }) {
  const count = participants.length;

  // CSS variables let the stylesheet pick phone or desktop columns (see meeting.css)
  const style = {
    '--cols': getColumns(count, false),
    '--cols-phone': getColumns(count, true),
  };

  return (
    <div className="video-grid" style={style}>
      {participants.map((person) => (
        <VideoTile
          key={person.id}
          name={person.name}
          stream={person.stream}
          isLocal={person.isLocal}
          micOn={person.micOn}
          videoOn={person.videoOn}
          mirrored={person.mirrored}
          connectionState={person.connectionState}
        />
      ))}
    </div>
  );
}
