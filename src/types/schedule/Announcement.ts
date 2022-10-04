export type AnnouncementFile = {
  filename: string,
  selector: string | undefined,
}

export type Announcement = {
  title: string
  files: AnnouncementFile[]
};
