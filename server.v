module main

import veb

// Our context struct must embed `veb.Context`!
pub struct Context {
    veb.Context
}

pub struct App {
    veb.StaticHandler
}

// This is how endpoints are defined in veb. This is the index route
pub fn (app &App) index(mut ctx Context) veb.Result {
    return $veb.html()
}

fn main() {
    mut app := &App{
    }
    app.handle_static('static', true)!
    // Pass the App and context type and start the web server on port 8080
    veb.run[App, Context](mut app, 8080)
}
