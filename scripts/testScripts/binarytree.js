function TreeNode(left,right,item){
   this.left = left;
   this.right = right;
   this.item = item;
}

TreeNode.prototype.itemCheck = function(){
   if (this.left==null) return this.item;
   else return this.item + this.left.itemCheck() - this.right.itemCheck();
}

function bottomUpTree(item,depth){
   if (depth>0){
      return new TreeNode(
          bottomUpTree(2*item-1, depth-1)
         ,bottomUpTree(2*item, depth-1)
         ,item
      );
   }
   else {
      return new TreeNode(null,null,item);
   }
}



function doTest(){
var minDepth = 4;
var n = 10;
var maxDepth = Math.max(minDepth + 2, n);
var stretchDepth = maxDepth + 1;

var check = bottomUpTree(0,stretchDepth).itemCheck();
console.log("stretch tree of depth " + stretchDepth + "\t check: " + check);

var longLivedTree = bottomUpTree(0,maxDepth);
for (var depth=minDepth; depth<=maxDepth; depth+=2){
   var iterations = 1 << (maxDepth - depth + minDepth);

   check = 0;
   for (var i=1; i<=iterations; i++){
      check += bottomUpTree(i,depth).itemCheck();
      check += bottomUpTree(-i,depth).itemCheck();
   }
   console.log(iterations*2 + "\t trees of depth " + depth + "\t check: " + check);
}

console.log("long lived tree of depth " + maxDepth + "\t check: " 
   + longLivedTree.itemCheck());

    var result = iterations*2 + "\t trees of depth " + depth + "\t check: " + check;
    return result;
}
