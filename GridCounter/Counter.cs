using System.Diagnostics;

namespace GridCounter
{
    public class Counter
    {
        public int Count(int gridSize)
        {
            Debug.Assert(gridSize > 0);

            //It turns out there's a formula + a proof for this.
            return gridSize*(gridSize+1)*(2*gridSize+1)/6;
        }
    }
}

