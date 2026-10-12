module.exports={async rewrites(){return [{source:'/',destination:'/index.html'},{source:'/run',destination:'/run.html'},{source:'/r/:c',destination:'/api/r?c=:c'}]}};
