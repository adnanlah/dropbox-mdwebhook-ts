import { Dropbox } from "dropbox"
import { accountsStore, cursorsStore } from "./helpers"
const showdown = require("showdown")
const converter = new showdown.Converter()

export default async function processMD(account: string) {
  try {
    const accessToken = accountsStore[account]
    const cursor = cursorsStore[account]
    if (!accessToken) return

    const dbx = new Dropbox({ accessToken })
    let listFolderData
    if (cursor) {
      const { result } = await dbx.filesListFolderContinue({ cursor: cursor })
      listFolderData = result
    } else {
      const { result } = await dbx.filesListFolder({
        path: "",
        recursive: true,
        include_non_downloadable_files: false
      })
      listFolderData = result
    }

    if (listFolderData.entries.length) {
      for (const entry of listFolderData.entries) {
        console.log("Entry name is: ", entry.name)
        if (entry[".tag"] === "file" && entry.path_lower && entry.name.split(".").pop() === "md") {
          console.log("It's a valid md file")

          const { result } = await dbx.filesDownload({ path: entry.path_lower })
          const genericResult = result as unknown as Record<string, any>
          const html = converter.makeHtml(genericResult.fileBinary.toString())
          dbx.filesUpload({
            path: "/" + entry.name.substring(0, entry.name.lastIndexOf(".")).trim() + ".html",
            contents: html
          })
        }
      }
    }

    cursorsStore[account] = listFolderData.cursor
    console.log("It has more? ", listFolderData.has_more)
    if (listFolderData.has_more) {
      await processMD(account)
    }
  } catch (err) {
    console.log("Error when processing MD files: ", err.message)
    console.log("Error object: ", err)
  }
}
