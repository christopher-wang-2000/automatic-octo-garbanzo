export type Event = {
    docId: string,
    title: string,
    startTime: Date,
    endTime: Date,
    description: string,
    creatorUid: string,
    friendsCanSee: boolean,
    invitedGroups: Array<string>
    rsvps: Array<string>,
    locationName: string,
    locationAddress: string,
    locationCoords: { latitude: number, longitude: number },
    placeId: string
  }

  export function getTimeString(event: Event): string {
    const today = (new Date()).toLocaleDateString();
    const startDate = (event.startTime.toLocaleDateString() === today) ? "Today" : event.startTime.toLocaleDateString();
    const startTime = event.startTime.toLocaleTimeString(undefined, { timeStyle: "short" });
    const endDate = (event.endTime.toLocaleDateString() === today) ? "Today" : event.endTime.toLocaleDateString();
    const endTime = event.endTime.toLocaleTimeString(undefined, { timeStyle: "short" });

    if (startDate === endDate) {
        return `${startDate}, ${startTime} to ${endTime}`;
    }
    else {
        return `Starts: ${startDate} ${startTime}\nEnds: ${endDate} ${endTime}`;
    }
  }