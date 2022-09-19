export type AnnouncementFile = {
  filename: string,
  selector: string,
}

export type Announcement = {
  title: string
  files: AnnouncementFile[]
};
