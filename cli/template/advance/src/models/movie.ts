// create database model here
// this is just an example,
// remove this and create actual DB model
// for mongo checkout `Typegoose`
// for sql checkout `TypeORM`

export const Movie = {
  find(id: string) {
    return {
      id,
      name: 'Avatar',
      year: 2010
    }
  },
  find_by(year: number) {
    return {
      id: '1',
      name: 'Avatar',
      year
    }
  }
}
